import axios from './httpRequester';

const path = '/lectures';

class GradeService {

    //성적정보 조회하기
    async getGradeList(lectureId) {
        const res = await axios.get(`${path}/${lectureId}/grades`);
        return res.data.result;
    }

    //성적 수정하기
    async updateGrades(lectureId, req) {
        const res = await axios.patch(`${path}/${lectureId}/grades`, req);
        return res.data;
    }

    //학생 - 내 성적 조회
    async getMyGrades() {
        const res = await axios.get(`/grade/mygrades`);
        return res.data.result;
}

}

export default new GradeService();